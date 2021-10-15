import {TabsListener} from "./TabsListener";
import {BlockerConfigurationStaticLoader} from "./BlockerConfiguration/BlockerConfigurationStaticLoader";
import {BlockerConfiguration} from "./BlockerConfiguration/BlockerConfiguration";
import {Messenger} from "./Messenger";

async function backgroundMain(): Promise<void> {
    const loader = new BlockerConfigurationStaticLoader();

    const cfg = new BlockerConfiguration(loader);
    await cfg.load();

    const listener = new TabsListener(cfg);
    const messenger = new Messenger(listener);

    messenger.listen();
    listener.listen();
}

backgroundMain().catch(error => console.error(error));