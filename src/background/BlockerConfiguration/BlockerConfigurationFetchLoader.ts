import {BlockerConfigurationLoader, BlockerConfigurationLoaderResult} from "./BlockerConfigurationLoader";

export class BlockerConfigurationFetchLoader extends BlockerConfigurationLoader {

    constructor(private fetchUrl: string) {
        super();
    }

    async load(): Promise<BlockerConfigurationLoaderResult> {
        const result = await fetch(this.fetchUrl);
        if (result.ok) {
            throw new Error('Failed to load config');
        }
        const config = await result.json();
        if (!config['selectors'] || !config['replacements']) {
            throw new Error('Malformed config loaded');
        }
        console.log(config);
        return config as BlockerConfigurationLoaderResult;
    }

}
