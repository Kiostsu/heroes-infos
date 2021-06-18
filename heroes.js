const fs = require('fs');
const config = require("./config.json");
const roles = JSON.parse(fs.readFileSync("./data/roles.json"), { encoding: 'utf8', flag: 'r' });
const StringUtils = require('./strings.js').StringUtils;
const heroesBase = JSON.parse(fs.readFileSync("./data/heroes-base.json"), { encoding: 'utf8', flag: 'r' });
const SEPARATOR = "------------------------------------------------------------------------"
let heroesInfos = [];
let freeHeroes = [];
let mustBanHeroes = [];
let compositions = [];

try {
	heroesInfos = JSON.parse(fs.readFileSync("./data/heroes-infos.json"));
	mustBanHeroes = JSON.parse(fs.readFileSync("./data/banlist.json"));
	compositions = JSON.parse(fs.readFileSync("./data/compositions.json"));
	freeHeroes = JSON.parse(fs.readFileSync("./data/freeweek.json"));
} catch (e) {
	process.stdout.write('error: ' + e + "\n");
}

exports.Heroes = {

	hero: null,
	mustBanHeroes: mustBanHeroes,
	freeHeroes: freeHeroes,
	heroesInfos: heroesInfos,
	compositions: compositions,

	init: function (command, heroName) {
		return this.assembleReturnMessage(command, heroName);
	},

	findAllHeroes: function (searchInfos) {
		if (searchInfos) {
			return heroesBase.map(hero => this.findHeroInfos(hero.id));
		}
		return heroesBase;
	},

	findHero: function (heroName, searchInfos) {
		let hero = heroesBase.find(hero => (hero.name.cleanVal() === heroName.cleanVal() ||
			hero.localizedName.cleanVal() === heroName.cleanVal() ||
			hero.accessLink.cleanVal() === heroName.cleanVal() ||
			hero.id.cleanVal() === heroName.cleanVal()));

		this.hero = hero;

		if (hero != null && searchInfos)
			this.hero = this.findHeroInfos(this.hero.id);

		return this.hero;
	},

	findHeroInfos: function (idParam) {
		return this.heroesInfos.find(hero => (hero.id === idParam));
	},

	findRoleById: function (roleId) {
		let role = roles.find(role => (role.id.toString().cleanVal() === roleId.toString().cleanVal()));
		if (role) {
			return role;
		}
	},

	findRoleByName: function (roleName) {
		let role = roles.find(role => (role.name.cleanVal() === roleName.cleanVal() ||
			role.localizedName.cleanVal() === roleName.cleanVal()));
		if (role) {
			return role;
		}
	},

	findHeroesByScore: function (roleId) {

		let list = this.heroesInfos.sort(function (a, b) {
			return a.infos.tierPosition - b.infos.tierPosition;
		});

		if (roleId != null) {
			list = list.filter(hero => (hero.role === roleId))
		}

		return list.sort(function (a, b) {
			return a.infos.tierPosition - b.infos.tierPosition;
		}).reverse().map(it => StringUtils.get('hero.score', this.getHeroName(it), it.infos.tierPosition)).splice(0,10).join('')
	},

	getRoleName: function (roleParam) {
		return `${roleParam.name} (${roleParam.localizedName})`;
	},

	getHeroName: function (heroParam) {
		let heroName = `${heroParam.name} (${heroParam.localizedName})`;
		if (heroParam.name == heroParam.localizedName) {
			heroName = `${heroParam.name}`;
		}
		return heroName
	},

	getHeroBuilds: function () {
		let reply = StringUtils.get('available.builds', this.getHeroName(this.hero));
		reply += this.hero.infos.builds.map(build => `\n${build.name}\n${build.skills}\n`).join('')
		return reply
	},

	getHeroRole: function () {
		return StringUtils.get('is.a', this.getHeroName(this.hero), this.getRoleName(this.findRoleById(this.hero.role)))		
	},

	getHeroUniverse: function () {
		return StringUtils.get('from.universe', this.hero.universe);
	},

	getHeroTierPosition: function () {
		return StringUtils.get('currently.on.tier', this.hero.infos.tierPosition);
	},

	getHeroCounters: function () {	
		let reply = StringUtils.get('countered.by', this.getHeroName(this.hero));
		reply += this.hero.infos.counters.map(counter => `${counter}\n`).join('');
		return reply;
	},

	getHeroStrongerMaps: function () {
		let reply = StringUtils.get('usually.stronger.on.maps', this.getHeroName(this.hero));	
		reply += this.hero.infos.strongerMaps.map(strongerMap => `${strongerMap}\n`).join('');
		return reply;
	},

	getHeroSynergies: function () {
		let reply = StringUtils.get('synergizes.with', this.getHeroName(this.hero));	
		reply += this.hero.infos.synergies.map(synergy => synergy + '\n').join('')
		return reply;
	},

	getHeroTips: function () {
		let tips = ""
		if (StringUtils.language === "pt-br") {
			tips = this.hero.infos.localizedTips;
		} else {
			tips = this.hero.infos.tips;
		}

		let reply = StringUtils.get('tips.for', this.getHeroName(this.hero));		
		reply += tips + '\n';
		return reply;
	},

	getHeroInfos: function () {
		let reply = "\n" + this.getHeroRole() +
			this.getHeroUniverse() +
			this.getHeroTierPosition() +		
			"\n" + this.getHeroBuilds() +
			SEPARATOR +
			"\n" + this.getHeroSynergies() +
			SEPARATOR +
			"\n" + this.getHeroCounters() +
			SEPARATOR +
			"\n" + this.getHeroStrongerMaps() +
			SEPARATOR +
			"\n" + this.getHeroTips();
		return reply
	},

	setHeroesInfos: function (heroesParam) {
		this.heroesInfos = heroesParam;
	},

	setBanHeroes: function (heroesParam) {
		this.mustBanHeroes = heroesParam;
	},

	setCompositions: function (compositionsParam) {
		this.compositions = compositionsParam;
	},

	setFreeHeroes: function (heroesParam) {
		this.freeHeroes = heroesParam;
	},

	assembleBanListReturnMessage: function () {
		let reply = StringUtils.get('suggested.bans');
		reply += this.mustBanHeroes.map(ban => ban + '\n').join('');
		return reply;
	},

	assembleFreeWeekHeroesReturnMessage: function () {
		let reply = StringUtils.get('no.free.heroes');

		if (this.freeHeroes.length > 0) {
			reply = StringUtils.get('free.heroes');
			reply += this.freeHeroes.map(freeHero => `${freeHero}\n`).join('');
		}
		return reply;
	},

	assembleSuggestHeroesReturnMessage: function (roleName) {
		let reply = StringUtils.get('suggested.heroes');
		if (roleName != null && roleName != "") {
			let role = this.findRoleByName(roleName)
			if (role != null) {
				reply += this.findHeroesByScore(parseInt(role.id))
			} else {
				reply = StringUtils.get('role.not.found', roleName);
			}
		} else {
			reply += this.findHeroesByScore()
		}
		return reply;
	},

	assembleTeamReturnMessage: function (heroes) {
		let heroesToPop = this.heroesInfos.sort(function (a, b) {
			return a.infos.tierPosition - b.infos.tierPosition;
		});

		let heroesArray = heroes.split(' ');
		let heroesFound = new Map();
		
		for (it of heroesArray) {
			let hero = this.findHero(it);
			 if (hero != null) {
				if (heroesFound.size >= 5) {
					break;
				}
				heroesFound.set(hero.id, hero);
			}	
		}
		
		if (heroesFound.size > 0) {
			for (i of heroesFound.values()) {
				heroesToPop = heroesToPop.filter(item => item.id !== i.id);				
			}
		}

		let reply = `Você informou os herois ${ Array.from(heroesFound).map(([key, value]) => `${this.getHeroName(value)}`)}\n`
		reply += `Compositions\n ${this.compositions.map(it => `score=${it.tierPosition} roles=(${it.roles.join(', ')})\n`).join(' ')}\n`;
		return reply;
	},

	assembleReturnMessage: function (commandObj, argument) {
		let reply = "";

		if (commandObj.name === 'Banlist') {
			reply = this.assembleBanListReturnMessage();
		} else if (commandObj.name === 'FreeWeek') {
			reply = this.assembleFreeWeekHeroesReturnMessage();
		} else if (commandObj.name === 'Suggest') {
			reply = this.assembleSuggestHeroesReturnMessage(argument);
		} else if (commandObj.name === 'Team') {
			reply = this.assembleTeamReturnMessage(argument);
		} else {
			this.findHero(argument, true);
			if (this.hero != null) {
				if (this.hero.infos != null && (this.hero.infos.counters.length > 0 &&
					this.hero.infos.synergies.length > 0 &&
					this.hero.infos.builds.length > 0)) {
					reply = {
						text: eval(`this.getHero${commandObj.name}()`),
						image: `images/${this.hero.name.cleanVal()}.png`
					};
				} else {
					reply = `There was not enough info found for the hero ${argument} \nPlease, call the ${config.prefix}update command to search for them`;
				}

			} else {
				reply = StringUtils.get('hero.not.found', argument);			
			}
		}

		return reply;
	}
};
