/**
 * CollabX Asset Dictionary
 * All image URLs and art assets are centralized here for easy swapping.
 */

import animeHeroImg from '../assets/images/anime_pokemon_hero_landscape_1791477263343.jpg';
import loginBannerImg from '../assets/images/login_ash_pikachu_pokeball_cottage_1791478292239.jpg';
import registerBannerImg from '../assets/images/pokemon_register_illustration_1791481165698.jpg';
import pokemonAdventureRightImg from '../assets/images/pokemon_research_adventure_1791483098819.jpg';
import loginAshPikachuTreeImg from '../assets/images/login_ash_pikachu_tree_1791483355159.jpg';
import renewableEnergyImg from '../assets/images/renewable_energy_optimization_1791484059132.jpg';

export const ASSETS = {
  // Pokéball Logo & Brand
  logo: {
    pokeballSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#0B1F4B" />
      <path d="M2 50 A48 48 0 0 1 98 50 Z" fill="#E5393C" />
      <path d="M2 50 A48 48 0 0 0 98 50 Z" fill="#FFFFFF" />
      <line x1="2" y1="50" x2="98" y2="50" stroke="#0B1F4B" stroke-width="8" />
      <circle cx="50" cy="50" r="18" fill="#0B1F4B" />
      <circle cx="50" cy="50" r="12" fill="#FFFFFF" />
      <circle cx="50" cy="50" r="6" fill="#F5B82E" />
    </svg>`
  },

  // Hero Background: Anime landscape with green mountains, futuristic glass domes, curved sky-bridges, boy with red cap & backpack on cliff with Pikachu
  hero: animeHeroImg,
  heroAnimeLandscape: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80',
  heroCliffBoyPikachu: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',

  // Authentication Banners (covers right 50% on auth pages)
  auth: {
    loginBanner: loginAshPikachuTreeImg,
    registerBanner: pokemonAdventureRightImg,
    cottageBanner: loginBannerImg,
    adventureBanner: pokemonAdventureRightImg,
    registerIllustration: registerBannerImg
  },

  // Mascots & Companions
  mascots: {
    pikachuWave: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=400&auto=format&fit=crop&q=80',
    eevee: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=80'
  },

  // Avatars (Characters & Faculty)
  // Swappable placeholders using seed format per prompt: https://picsum.photos/seed/<name>/200
  avatars: {
    ash: 'https://picsum.photos/seed/ash/200', // Ash Ketchum (red cap)
    misty: 'https://picsum.photos/seed/misty/200', // Misty Williams
    brock: 'https://picsum.photos/seed/brock/200', // Brock Harrison
    gary: 'https://picsum.photos/seed/gary/200', // Gary Oak
    drFahim: 'https://picsum.photos/seed/drfahim/200', // Dr. Fahim Rahman
    drSarhan: 'https://picsum.photos/seed/drsarhan/200', // Dr. Sarhan
    drNazmul: 'https://picsum.photos/seed/drnazmul/200', // Dr. Nazmul Hossain
    drSabbir: 'https://picsum.photos/seed/drsabbir/200', // Dr. Sabbir Islam
    drMIslam: 'https://picsum.photos/seed/drmislam/200', // Dr. M. Islam
    admin: 'https://picsum.photos/seed/admin/200',
    pikachu: 'https://picsum.photos/seed/pikachu/200',
    eevee: 'https://picsum.photos/seed/eevee/200'
  },

  // Project Thumbnails
  projects: {
    diseasePrediction: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80',
    smartAgriculture: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=600&auto=format&fit=crop&q=80',
    secureDataCloud: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    studentPerformance: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80',
    academicBlockchain: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&auto=format&fit=crop&q=80',
    renewableEnergy: renewableEnergyImg,
    smartCampus: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=600&auto=format&fit=crop&q=80',
    defaultProject: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&auto=format&fit=crop&q=80'
  }
};
