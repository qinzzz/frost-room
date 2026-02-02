const assets = import.meta.glob('../assets/*.svg', { eager: true, query: '?url' });

export interface FigureAsset {
    url: string;
    name: string;
    activity: 'stand' | 'sit' | 'walk' | 'run';
    direction?: 'left' | 'right';
}

const FIGURE_PREFIXES = ['sit', 'walk', 'run', 'stand'];

export const ASSETS: FigureAsset[] = Object.entries(assets)
    .filter(([path]) => {
        const fileName = path.split('/').pop()?.toLowerCase() || '';
        return FIGURE_PREFIXES.some(prefix => fileName.startsWith(prefix));
    })
    .map(([path, module]: [string, any]) => {
        const url = module.default || module;
        const fileName = path.split('/').pop() || '';
        const name = fileName.replace('.svg', '');

        let activity: FigureAsset['activity'] = 'stand';
        if (name.startsWith('sit')) activity = 'sit';
        else if (name.startsWith('walk')) activity = 'walk';
        else if (name.startsWith('run')) activity = 'run';

        let direction: 'left' | 'right' | undefined;
        if (name.toLowerCase().includes('left')) direction = 'left';
        else if (name.toLowerCase().includes('right')) direction = 'right';

        return { url, name, activity, direction };
    });

export interface CityAsset {
    url: string;
    name: string;
}

export const CITY_ASSETS: CityAsset[] = Object.entries(assets)
    .filter(([path]) => {
        const fileName = path.split('/').pop()?.toLowerCase() || '';
        return !FIGURE_PREFIXES.some(prefix => fileName.startsWith(prefix));
    })
    .map(([path, module]: [string, any]) => {
        const url = module.default || module;
        const fileName = path.split('/').pop() || '';
        const name = fileName.replace('.svg', '');
        return { url, name };
    });

export const ASSET_URLS = ASSETS.map(a => a.url);
