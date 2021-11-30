import {
    BlockerConfigurationLoader,
    BlockerConfigurationLoaderResult, BlockerConfigurationPetitionSignerOrgs,
    BlockerConfigurationReplacements,
} from "./BlockerConfigurationLoader";
import {SelectorConfiguration} from "../../lib/SelectorConfiguration";
import {BlockerConfigurationStorage} from "./BlockerConfigurationStorage";

export class BlockerConfiguration {

    private static DEFAULT_UPDATE_FREQUENCY_MINUTES = 60;
    private static RESTART_ON_FAILURE_SECONDS = 10;

    private map: Map<string, SelectorConfiguration[] | undefined> = new Map();
    private replacements: BlockerConfigurationReplacements | undefined = undefined;
    private petitionSigners: BlockerConfigurationPetitionSignerOrgs[] | undefined = undefined;

    constructor(private readonly loader: BlockerConfigurationLoader,
                private readonly storage: BlockerConfigurationStorage,
                private readonly updateFrequencyMinutes: number) {
        if (!(this.updateFrequencyMinutes > 0)) {
            this.updateFrequencyMinutes = BlockerConfiguration.DEFAULT_UPDATE_FREQUENCY_MINUTES;
        }
    }

    start(): Promise<void> {
        console.log('start');
        return new Promise(resolve => {
            this.load().then(() => {
                console.log('loaded');
                resolve();
                setInterval(() => this.load(), this.updateFrequencyMinutes * 60 * 1000);
            }).catch(error => {
                console.log(error);
                setTimeout(() => this.start(), BlockerConfiguration.RESTART_ON_FAILURE_SECONDS * 1000);
            });
        });
    }

    async load(): Promise<void> {
        const result = await this.doLoad();
        if (!result) {
            throw new Error('Failed to load');
        }
        this.map.clear();
        this.replacements = result.replacements;
        this.petitionSigners = result.petitionSignerOrgs;
        for (const row of result.selectors) {
            this.map.set(row.domainName, row.selectors);
        }
    }

    private async doLoad(): Promise<BlockerConfigurationLoaderResult | undefined> {
        try {
            const result = await this.loader.load();
            await this.storage.store(result);
            return result;
        } catch (e) {
            return this.storage.load();
        }
    }

    public get replacementsConfig(): BlockerConfigurationReplacements {
        if (!this.replacements) {
            throw new Error('Replacements were not loaded');
        }
        return this.replacements;
    }

    public get substitutions(): Record<string, string>[] {
        if (!this.petitionSigners) {
            throw new Error('Petition signers were not loaded');
        }
        return this.petitionSigners as Record<string, any>[];
    }

    find(normalizedDomainName: string): SelectorConfiguration[] | undefined {
        const exactMatch = this.map.get(normalizedDomainName);
        return exactMatch || this.findBySuffix(normalizedDomainName);
    }

    private findBySuffix(domainName: string): SelectorConfiguration[] | undefined {
        for (const [domainNameSuffix, config] of this.map) {
            if (domainName.endsWith(domainNameSuffix)) {
                return config;
            }
        }
    }

}
