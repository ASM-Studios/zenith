{
  pkgs,
  lib,
  config,
  inputs,
  ...
}:

{
  packages = [
    pkgs.git
    pkgs.bruno
    pkgs.openssl
  ];

  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_24;
    npm = {
      enable = true;
      install.enable = true;
    };
  };

  dotenv.enable = true;

  profiles.android.module = {
    android = {
      enable = true;
      platforms.version = [ "36" ];
      abis = [ "x86_64" ];
      systemImageTypes = [ "google_apis_playstore" ];
      ndk.enable = false;
      sources.enable = false;
      googleTVAddOns.enable = false;
      extras = [ ];
    };
  };

  enterShell = ''
    echo "node $(node --version) / npm $(npm --version)"
  '';

  enterTest = ''
    node --version | grep --color=auto "${pkgs.nodejs_24.version}"
  '';
}
