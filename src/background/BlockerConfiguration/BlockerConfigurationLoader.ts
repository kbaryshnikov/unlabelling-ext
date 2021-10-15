import {SelectorConfiguration} from "../../lib/SelectorConfiguration";

export interface BlockerConfigurationLoaderRow {
    domainName: string;
    selectors: SelectorConfiguration[] | undefined;
}

export interface BlockerConfigurationReplacements {
    searchText: string;
    replaceHtml: string;
}

export interface BlockerConfigurationLoaderResult {
    rows: BlockerConfigurationLoaderRow[];
    replacements: BlockerConfigurationReplacements;
    updatedAt: number;
}

export abstract class BlockerConfigurationLoader {

    abstract load(): Promise<BlockerConfigurationLoaderResult>;

}