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
    pkgs.podman-compose
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

  enterShell = ''
    echo "node $(node --version) / npm $(npm --version)"
  '';

  enterTest = ''
    node --version | grep --color=auto "${pkgs.nodejs_24.version}"
  '';
}
