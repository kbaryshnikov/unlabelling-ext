import {TabsListener} from "./TabsListener";
import {BlockerConfiguration} from "./BlockerConfiguration/BlockerConfiguration";
import {Messenger} from "./Messenger";
import {BlockerConfigurationFetchLoader} from "./BlockerConfiguration/BlockerConfigurationFetchLoader";
import {config} from "./config";
import {AppConfig} from "./AppConfig";
import {BlockerConfigurationStorage} from "./BlockerConfiguration/BlockerConfigurationStorage";

async function backgroundMain(config: AppConfig): Promise<void> {
    const loader = new BlockerConfigurationFetchLoader(config.update.url);
    const storage = new BlockerConfigurationStorage();

    const cfg = new BlockerConfiguration(loader, storage, config.update.periodMinutes);
    await cfg.start();

    const listener = new TabsListener(cfg);
    const messenger = new Messenger(listener);

    messenger.listen();
    listener.listen();
}

backgroundMain(config).catch(error => console.error(error));
