import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const actionsUrl = 'https://github.com/P1ge0n8/paperbullet/actions';
const siteUrl = 'https://p1ge0n8.github.io/paperbullet/';
const expectedOrigin = /^(?:https:\/\/github\.com\/P1ge0n8\/paperbullet(?:\.git)?|git@github\.com:P1ge0n8\/paperbullet(?:\.git)?)$/i;
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(command, args, capture = false) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    encoding: 'utf8',
  });
  if (result.error) throw new Error(`无法启动 ${command}，请检查是否已安装。`);
  if (result.status !== 0) {
    throw new Error(`${command} ${args[0] || ''} 未完成。请处理上方提示后重试；本脚本不会强制推送。`);
  }
  return capture ? result.stdout.trim() : '';
}

function ensurePublishTarget() {
  if (run('git', ['branch', '--show-current'], true) !== 'main') {
    throw new Error('请先在 VS Code 切换到 main 分支，再运行发布。');
  }
  if (!expectedOrigin.test(run('git', ['remote', 'get-url', '--push', 'origin'], true))) {
    throw new Error('origin 推送地址不是 P1ge0n8/paperbullet，已停止。请先确认打开的是锵稿正式项目。');
  }
  if (!expectedOrigin.test(run('git', ['remote', 'get-url', 'origin'], true))) {
    throw new Error('origin 获取地址不是 P1ge0n8/paperbullet，已停止。请先确认仓库配置。');
  }
  const dirty = run('git', ['status', '--porcelain=v1', '--untracked-files=no'], true);
  if (dirty) {
    console.log(dirty);
    throw new Error('还有未提交的已跟踪文件。请在 VS Code 查看修改、暂存并提交，然后重新运行发布。');
  }
}

async function main() {
  if (process.argv.includes('--help')) {
    console.log('用法：npm run publish:github\n\n先在 VS Code 保存、检查、暂存并提交。脚本检查 main、目标仓库和已跟踪文件，获取远端状态，运行 npm run check，列出待发布提交，等待你输入「发布」，最后执行 git push origin main。不会自动暂存、提交或强制推送。\n\n公开网站：' + siteUrl + '\n部署进度：' + actionsUrl);
    return;
  }
  if (process.argv.length > 2) throw new Error('不支持此参数。使用 --help 查看说明。');
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('请在 VS Code 的交互终端运行此命令，发布前需要由你输入「发布」。');
  }

  ensurePublishTarget();
  console.log('正在获取 GitHub 的 main 分支状态…');
  run('git', ['fetch', 'origin', 'main']);
  const remoteAncestor = spawnSync('git', ['merge-base', '--is-ancestor', 'origin/main', 'HEAD'], { cwd: root, stdio: 'ignore' });
  if (remoteAncestor.status !== 0) {
    throw new Error('GitHub 存在本地尚未合并的提交。请在 VS Code 拉取并解决差异、检查后再发布。');
  }
  const count = Number(run('git', ['rev-list', '--count', 'origin/main..HEAD'], true));
  if (!count) {
    console.log('本地 main 与 GitHub 没有待推送的提交。\n如果刚编辑过，请先在 VS Code 提交。\n部署进度：' + actionsUrl);
    return;
  }

  const untracked = run('git', ['ls-files', '--others', '--exclude-standard', '-z'], true).split('\0').filter(Boolean);
  if (untracked.length) {
    console.log('\n以下未跟踪文件不会自动加入这次发布。若是新文章素材或代码，请先暂存并提交：');
    for (const file of untracked) console.log('  ' + JSON.stringify(file));
  }

  console.log('\n开始发布前检查…');
  run(npm, ['run', 'check']);
  ensurePublishTarget();
  const checkedCommit = run('git', ['rev-parse', 'HEAD'], true);
  console.log('\n将推送以下 ' + count + ' 个本地提交：');
  console.log(run('git', ['log', '--oneline', 'origin/main..HEAD'], true));
  console.log('\n目标：P1ge0n8/paperbullet → main\n网站：' + siteUrl);
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  let answer;
  try { answer = await prompt.question('确认上线请输入「发布」，输入其他内容取消：'); }
  finally { prompt.close(); }
  if (answer.trim() !== '发布') {
    console.log('已取消，GitHub 没有更新。');
    return;
  }
  ensurePublishTarget();
  if (run('git', ['rev-parse', 'HEAD'], true) !== checkedCommit) {
    throw new Error('检查后本地提交发生变化，请重新运行发布。');
  }
  run('git', ['push', 'origin', 'main']);
  console.log('\n提交已推送。GitHub Actions 完成后网站才会更新。\n查看部署：' + actionsUrl + '\n公开网站：' + siteUrl);
}

main().catch(error => {
  console.error('\n' + error.message);
  process.exitCode = 1;
});
