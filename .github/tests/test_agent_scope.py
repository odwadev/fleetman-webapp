"""Exercise the workflow's actual patch exporter against disposable Git repos."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

WORKFLOW = Path(__file__).resolve().parents[1] / 'workflows/agent-ready.yml'
text = WORKFLOW.read_text()
block = text.split('    - name: Enforce source scope and export patch\n', 1)[1]
block = block.split('      run: |\n', 1)[1].split('    - uses:', 1)[0]
EXPORT = '\n'.join(line[8:] for line in block.splitlines())


class ScopeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'repo'
        self.root.mkdir()
        self.output = Path(self.temp.name) / 'output'
        self.output.mkdir()
        self.git('init', '-q')
        self.git('config', 'user.name', 'Scope Test')
        self.git('config', 'user.email', 'scope@example.invalid')
        for name in ['src/app/app.ts', 'src/app/app.spec.ts', 'src/styles.css',
                     'package.json', '.github/workflows/example.yml',
                     'src/environments/environment.ts']:
            self.write(name, 'original\n')
        self.git('add', '.')
        self.git('commit', '-qm', 'Fixture')
        self.base = self.git('rev-parse', 'HEAD').strip()

    def git(self, *args):
        return subprocess.check_output(['git', *args], cwd=self.root, text=True)

    def write(self, name, content):
        p = self.root / name
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content)

    def export(self):
        return subprocess.run(['bash', '-e', '-c', EXPORT], cwd=self.root,
                              env={**os.environ, 'BASE_SHA': self.base,
                                   'RUNNER_TEMP': str(self.output)},
                              capture_output=True, text=True)

    def test_source_changes_new_files_and_deletions_survive_patch(self):
        self.write('src/app/app.ts', 'updated\n')
        self.write('src/app/new.component.html', '<p>new</p>\n')
        self.write('src/app/new.component.spec.ts', 'new test\n')
        self.write('src/styles.css', 'body {}\n')
        (self.root / 'src/app/app.spec.ts').unlink()
        result = self.export()
        self.assertEqual(result.returncode, 0, result.stderr)
        patch = str(self.output / 'agent.patch')
        self.git('reset', '--hard', self.base)
        self.git('apply', '--check', patch)
        self.git('apply', patch)
        self.assertEqual((self.root / 'src/app/app.ts').read_text(), 'updated\n')
        self.assertTrue((self.root / 'src/app/new.component.html').is_file())
        self.assertTrue((self.root / 'src/app/new.component.spec.ts').is_file())
        self.assertFalse((self.root / 'src/app/app.spec.ts').exists())

    def test_protected_files_are_rejected_even_when_staged(self):
        for name in ['package.json', '.github/workflows/example.yml',
                     'src/environments/environment.ts']:
            with self.subTest(name=name):
                self.git('reset', '--hard', self.base)
                self.write(name, 'changed\n')
                self.git('add', name)
                result = self.export()
                self.assertNotEqual(result.returncode, 0)
                self.assertIn('Outside approved source scope', result.stderr)

    def test_untracked_out_of_scope_file_is_rejected(self):
        self.write('src/app/app.ts', 'updated\n')
        self.write('new-workflow.yml', 'unexpected\n')
        self.assertNotEqual(self.export().returncode, 0)
        self.assertFalse((self.output / 'agent.patch').exists())

    def test_symlink_is_rejected(self):
        (self.root / 'src/app/linked.ts').symlink_to('../../package.json')
        result = self.export()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Symlinks are not allowed', result.stderr)

    def test_agent_commit_is_rejected(self):
        self.write('src/app/app.ts', 'updated\n')
        self.git('add', '.')
        self.git('commit', '-qm', 'Unexpected agent commit')
        result = self.export()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('must not create commits', result.stderr)

    def test_empty_patch_is_rejected(self):
        result = self.export()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Agent produced no changes', result.stderr)


if __name__ == '__main__':
    unittest.main()
