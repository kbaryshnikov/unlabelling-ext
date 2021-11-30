import {SelectorConfiguration} from "../../lib/SelectorConfiguration";

export interface BlockerConfigurationSelectorsSet {
    domainName: string;
    selectors: SelectorConfiguration[] | undefined;
}

export interface BlockerConfigurationReplacements {
    searchTexts: string[];
    replaceHtml: string;
}

export interface BlockerConfigurationPetitionSignerOrgs {
    name: string;
    title: string;
    titleAccusative: string;
    websiteUrl: string;
}

export interface BlockerConfigurationLoaderResult {
    selectors: BlockerConfigurationSelectorsSet[];
    replacements: BlockerConfigurationReplacements;
    petitionSignerOrgs: BlockerConfigurationPetitionSignerOrgs[];
}

export abstract class BlockerConfigurationLoader {

    abstract load(): Promise<BlockerConfigurationLoaderResult>;

}
