import TypedEmitter from 'typed-emitter';
type ElectronAppUniversalProtocolClientEvents = {
    request: (requestUrl: string) => void;
};
declare const ElectronAppUniversalProtocolClient_base: new () => TypedEmitter<ElectronAppUniversalProtocolClientEvents>;
declare class ElectronAppUniversalProtocolClient extends ElectronAppUniversalProtocolClient_base {
    private isInitialized;
    initialize({ protocol, mode, }: {
        protocol: string;
        mode?: `development` | `production`;
    }): Promise<void>;
}
export declare const electronAppUniversalProtocolClient: ElectronAppUniversalProtocolClient;
export default electronAppUniversalProtocolClient;
