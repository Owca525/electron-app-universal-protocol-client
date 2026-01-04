import * as electron from 'electron';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';
import { EventEmitter } from 'events';
import TypedEmitter from 'typed-emitter';

type ElectronAppUniversalProtocolClientEvents = {
  request: (requestUrl: string) => void;
}

class ElectronAppUniversalProtocolClient extends (EventEmitter as new () => TypedEmitter<ElectronAppUniversalProtocolClientEvents>) {

  private isInitialized: boolean = false;

  async initialize(
    {
      protocol,
      mode,
    }: {
      protocol: string;
      mode?: `development` | `production`;
    },
  ) {

    if (this.isInitialized) {

      throw new Error(`ElectronAppUniversalProtocolClient is already initialized.`);
    }

    await electron.app.whenReady();
    if (mode === `development`) {

      const electronAppMainScriptPath = path.resolve(process.argv[1]);

      if (os.platform() === `linux`) {

        // HACK: As `electron.app.setAsDefaultProtocolClient` is based on `xdg-settings set default-url-scheme-handler` which is not supported on Xfce, we manually create new .desktop entry and use `xdg-mime` to make it default handler for protocol URLs.

        try {

          const electronAppDesktopFileName = `electron-app-universal-protocol-client-${crypto.createHash(`md5`).update(`${process.execPath}${electronAppMainScriptPath}`).digest(`hex`)}.desktop`;

          const electronAppDesktopFilePath = path.resolve(
            electron.app.getPath(`home`),
            `.local`,
            `share`,
            `applications`,
            electronAppDesktopFileName,
          );

          fs.mkdirSync(
            path.dirname(electronAppDesktopFilePath),
            {
              recursive: true,
            },
          );

          fs.writeFileSync(
            electronAppDesktopFilePath,
            [
              `[Desktop Entry]`,
              `Name=Electron (pid: ${process.pid})`,
              `Exec=${process.execPath} ${electronAppMainScriptPath} %u`,
              `Type=Application`,
              `Terminal=false`,
              `MimeType=x-scheme-handler/${protocol};`
            ].join(`\n`),
          );

          execSync(`xdg-mime default ${electronAppDesktopFileName} x-scheme-handler/${protocol}`);

        } catch {

          // ignore
        }
      }

      electron.app.setAsDefaultProtocolClient(
        protocol,
        process.execPath,
        [
          electronAppMainScriptPath,
        ],
      );

    } else {

      electron.app.setAsDefaultProtocolClient(
        protocol,
        process.execPath,
        [],
      );
    }

    electron.app.on(
      `second-instance`,
      (
        _event,
        argv,
      ) => {

        const secondInstanceRequestUrl = argv.find(
          (arg) => arg.startsWith(`${protocol}`),
        );

        if (secondInstanceRequestUrl !== undefined) {

          this.emit(`request`, secondInstanceRequestUrl);
        }
      },
    );

    const mainInstanceRequestUrl = process.argv.find(
      (arg) => arg.startsWith(`${protocol}`),
    );

    if (mainInstanceRequestUrl !== undefined) {

      this.emit(`request`, mainInstanceRequestUrl);
    }

    this.isInitialized = true;
  }
}

export const electronAppUniversalProtocolClient = new ElectronAppUniversalProtocolClient();

export default electronAppUniversalProtocolClient;
