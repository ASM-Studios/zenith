const generic = 'Enable virtualization in the BIOS, then add your user to the kvm group and log in again.';

const fixes: Record<string, string> = {
  debian: 'sudo apt install qemu-kvm && sudo adduser "$USER" kvm',
  fedora: 'sudo dnf install qemu-kvm && sudo usermod -aG kvm "$USER"',
  arch: 'sudo pacman -S qemu-base && sudo usermod -aG kvm "$USER"',
};

const familyOf: Record<string, string> = { ubuntu: 'debian', linuxmint: 'debian', rhel: 'fedora', centos: 'fedora' };

function osReleaseIds(osRelease: string): string[] {
  return [...osRelease.matchAll(/^ID(?:_LIKE)?="?([^"\n]*)"?$/gm)].flatMap((match) =>
    match.slice(1).flatMap((value) => value.split(' ')),
  );
}

export function kvmFix(osRelease: string): string {
  for (const id of osReleaseIds(osRelease)) {
    const fix = fixes[familyOf[id] ?? id];
    if (fix !== undefined) {
      return `${generic}\nOn this distribution: ${fix}`;
    }
  }
  return generic;
}
