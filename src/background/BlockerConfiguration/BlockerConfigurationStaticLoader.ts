import {BlockerConfigurationLoader, BlockerConfigurationLoaderResult} from "./BlockerConfigurationLoader";

const staticMap: BlockerConfigurationLoaderResult = {
    rows: [
        {
            domainName: 'meduza.io',
            selectors: [
                {selector: '#div-gpt-ad'},
                {selector: '.ebala .look-how-they-massacred-my-boy'}
            ],
        },
        {
            domainName: 'zona.media',
            selectors: [
                {selector: '.mz-agent-banner__text'},
            ],
        },
        {
            domainName: 'tvrain.ru',
            selectors: [
                {selector: '[class$=foreign-agent-text]'},
            ],
        },
        {
            domainName: 'pasmi.ru',
            selectors: [
                {selector: '.content .excerpt'},
            ],
        },
        {
            domainName: 'istories.media',
            selectors: [
                {selector: '.ForeignAgentBanner'},
                {
                    selector: '.Pandora-container',
                    styleTweaks: [{selector: '.Header_LogoWrapper', styles: {display: 'none'}}],
                },
            ],
        },
    ],
    replacements: {
        searchTexts: ['данноесообщениематериалсозданоиилираспространеноиностраннымсредствоммассовойинформациивыполняющимфункциииностранногоагентаиилироссийскимюридическимлицомвыполняющимфункциииностранногоагента'],
        replaceHtml: 'Вообще-то тут должна быть маркировка. Но лучше пусть будет реклама тех, кто выступил против законодательства об «иноагентах». <a style="font-weight:600" target="_blank" href="https://ovdinfo.org/">Поддержите ОВД-Инфо</a>!',
    },
    updatedAt: Date.now(),
};

export class BlockerConfigurationStaticLoader extends BlockerConfigurationLoader {

    async load(): Promise<BlockerConfigurationLoaderResult> {
        return staticMap;
    }

}