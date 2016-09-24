export class config {
  public static googleMapsKey: string = 'AIzaSyD8WtOa0Mw_lpppdbXQrORnabd9LK3bri8';
  public static latitude: number = 38.624691;
  public static longitude: number = -90.184776;
  public static zoom: number = 12;
  public static leaps: number = 4;
  public static steps: number = 10;
  public static maxSteps: number = 25;

  public static os: string = 'windows';
  public static workers: number = 4;
  public static accountColumns: string = 'username, password';

  public static windowsTemplates: ICommandTemplate = {
    setup: 'taskkill /IM python.exe /F',
    server: 'Start "Server" /d {pogomap-directory} /MIN python.exe runserver.py -os -l "{location}"',
    worker: 'Start "Worker{index}" /d {pogomap-directory} /MIN python.exe runserver.exe -ns -l "{location}" -st {steps} {auth-template}',
    auth: '-u {username} -p "{password}"',
    delay: 'ping 127.0.0.1 -n 6 > null',
    filename: 'launch.bat'
  };

  public static linuxTemplates: ICommandTemplate = {
    setup: '#!/usr/bin/env bash',
    server: 'nohup python runserver.py -os -l \'{location}\' &',
    worker: 'nohup python runserver.py -ns -l \'{location}\' -st {steps} {auth-template}',
    auth: '-u {username} -p \'{password}\'',
    delay: 'sleep 0.5;',
    filename: 'launch.sh'
  };
};

export interface ICommandTemplate {
  setup: string;
  server: string;
  worker: string;
  auth: string;
  delay: string;
  filename: string;
}
