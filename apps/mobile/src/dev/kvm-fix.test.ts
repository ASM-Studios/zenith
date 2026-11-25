import { describe, expect, it } from 'vitest';
import { kvmFix } from './kvm-fix.ts';

describe('kvmFix', () => {
  it('suggests apt on Ubuntu', () => {
    expect(kvmFix('ID=ubuntu\nID_LIKE=debian\n')).toContain('sudo adduser "$USER" kvm');
  });

  it('suggests dnf on Fedora', () => {
    expect(kvmFix('NAME="Fedora Linux"\nID=fedora\n')).toContain('sudo dnf install qemu-kvm');
  });

  it('suggests pacman on Arch', () => {
    expect(kvmFix('ID=arch\n')).toContain('sudo pacman -S qemu-base');
  });

  it('follows ID_LIKE for a derivative distribution', () => {
    expect(kvmFix('ID=manjaro\nID_LIKE="arch"\n')).toContain('pacman');
  });

  it('falls back to the generic fix on an unknown distribution', () => {
    expect(kvmFix('ID=nixos\n')).toBe(
      'Enable virtualization in the BIOS, then add your user to the kvm group and log in again.',
    );
  });
});
