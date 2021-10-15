import {
    BlockerConfigurationLoader,
    BlockerConfigurationLoaderResult,
    BlockerConfigurationReplacements,
} from "./BlockerConfigurationLoader";
import {SelectorConfiguration} from "../../lib/SelectorConfiguration";

export class BlockerConfiguration {

    private map: Map<string, SelectorConfiguration[] | undefined> = new Map();
    private replacements: BlockerConfigurationReplacements | undefined = undefined;
    private lastUpdated: number = 0;

    constructor(private readonly loader: BlockerConfigurationLoader,
                private readonly fallbackLoader?: BlockerConfigurationLoader | undefined) {
    }

    async load(): Promise<void> {
        const result = await this.doLoad();
        this.map.clear();
        this.replacements = result.replacements;
        for (const row of result.rows) {
            this.map.set(row.domainName, row.selectors);
        }
        this.lastUpdated = result.updatedAt;
    }

    private async doLoad(): Promise<BlockerConfigurationLoaderResult> {
        try {
            return this.loader.load();
        } catch (e) {
            if (this.fallbackLoader) {
                return this.fallbackLoader.load();
            } else {
                throw e;
            }
        }
    }

    public get replacementsConfig(): BlockerConfigurationReplacements {
        if (!this.replacements) {
            throw new Error('Replacements were not loaded');
        }
        return this.replacements;
    }

    public get lastUpdatedAt(): number {
        return this.lastUpdated;
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
