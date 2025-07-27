export interface Region {
	id: string;
	name: string;
	nameEn: string;
}

export const BULGARIAN_REGIONS: Region[] = [
	{ id: 'sofia', name: 'София', nameEn: 'Sofia' },
	{ id: 'plovdiv', name: 'Пловдив', nameEn: 'Plovdiv' },
	{ id: 'varna', name: 'Варна', nameEn: 'Varna' },
	{ id: 'burgas', name: 'Бургас', nameEn: 'Burgas' },
	{ id: 'ruse', name: 'Русе', nameEn: 'Ruse' },
	{ id: 'stara-zagora', name: 'Стара Загора', nameEn: 'Stara Zagora' },
	{ id: 'pleven', name: 'Плевен', nameEn: 'Pleven' },
	{ id: 'sliven', name: 'Сливен', nameEn: 'Sliven' },
	{ id: 'dobrich', name: 'Добрич', nameEn: 'Dobrich' },
	{ id: 'shumen', name: 'Шумен', nameEn: 'Shumen' },
	{ id: 'pernik', name: 'Перник', nameEn: 'Pernik' },
	{ id: 'haskovo', name: 'Хасково', nameEn: 'Haskovo' },
	{ id: 'yambol', name: 'Ямбол', nameEn: 'Yambol' },
	{ id: 'pazardzhik', name: 'Пазарджик', nameEn: 'Pazardzhik' },
	{ id: 'blagoevgrad', name: 'Благоевград', nameEn: 'Blagoevgrad' },
	{ id: 'veliko-tarnovo', name: 'Велико Търново', nameEn: 'Veliko Tarnovo' },
	{ id: 'vratsa', name: 'Враца', nameEn: 'Vratsa' },
	{ id: 'gabrovo', name: 'Габрово', nameEn: 'Gabrovo' },
	{ id: 'vidin', name: 'Видин', nameEn: 'Vidin' },
	{ id: 'montana', name: 'Монтана', nameEn: 'Montana' },
	{ id: 'kardzhali', name: 'Кърджали', nameEn: 'Kardzhali' },
	{ id: 'kyustendil', name: 'Кюстендил', nameEn: 'Kyustendil' },
	{ id: 'silistra', name: 'Силистра', nameEn: 'Silistra' },
	{ id: 'lovech', name: 'Ловеч', nameEn: 'Lovech' },
	{ id: 'razgrad', name: 'Разград', nameEn: 'Razgrad' },
	{ id: 'targovishte', name: 'Търговище', nameEn: 'Targovishte' },
	{ id: 'smolyan', name: 'Смолян', nameEn: 'Smolyan' }
];

export function getRegionName(regionId: string, locale: string): string {
	const region = BULGARIAN_REGIONS.find(r => r.id === regionId);
	if (!region) return regionId;
	return locale === 'bg' ? region.name : region.nameEn;
}

export function sortRegionsByName(locale: string): Region[] {
	return [...BULGARIAN_REGIONS].sort((a, b) => {
		const nameA = locale === 'bg' ? a.name : a.nameEn;
		const nameB = locale === 'bg' ? b.name : b.nameEn;
		return nameA.localeCompare(nameB, locale);
	});
}