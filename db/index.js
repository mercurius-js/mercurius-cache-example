'use strict'

// a volatile database

const db = {
  users: {
    1: { name: 'Alice', country: 'it' },
    2: { name: 'Bob', country: 'us' },
    3: { name: 'Charlie', country: 'fr' },
    4: { name: 'Duana', country: 'au' },
    5: { name: 'Eve', country: 'uk' },
    6: { name: 'Frank', country: 'es' },
    7: { name: 'Grace', country: 'de' },
    8: { name: 'Heidi', country: 'ch' },
    9: { name: 'Irene', country: 'ar' }
  },
  groups: {
    10: { name: 'Gamers', users: [1, 2, 3] },
    11: { name: 'Guitar Players', users: [4, 5, 6] },
    12: { name: 'Snowboarders', users: [7, 8, 9] },
    13: { name: 'Divers', users: [3, 6, 9] },
    14: { name: 'Surfers', users: [2, 4, 6] },
    15: { name: 'Bikers', users: [1, 3, 5] },
    16: { name: 'Basketball Players', users: [4, 7, 8] }
  },
  countries: {
    it: { name: 'Italy' },
    us: { name: 'United States' },
    fr: { name: 'France' },
    de: { name: 'Germany' },
    es: { name: 'Spain' },
    uk: { name: 'United Kingdom' },
    ch: { name: 'Switzerland' },
    au: { name: 'Australia' },
    nz: { name: 'New Zealand' },
    ca: { name: 'Canada' },
    jp: { name: 'Japan' },
    cn: { name: 'China' },
    br: { name: 'Brazil' },
    mx: { name: 'Mexico' },
    ar: { name: 'Argentina' },
    cl: { name: 'Chile' },
    ru: { name: 'Russia' },
    in: { name: 'India' },
    kr: { name: 'South Korea' },
    th: { name: 'Thailand' },
    sa: { name: 'South Africa' },
    eg: { name: 'Egypt' },
    gr: { name: 'Greece' },
    pt: { name: 'Portugal' },
    pl: { name: 'Poland' },
    ro: { name: 'Romania' },
    tr: { name: 'Turkey' },
    dk: { name: 'Denmark' },
    fi: { name: 'Finland' },
    no: { name: 'Norway' },
    se: { name: 'Sweden' },
    ie: { name: 'Ireland' },
    is: { name: 'Iceland' },
    at: { name: 'Austria' },
    be: { name: 'Belgium' },
    bg: { name: 'Bulgaria' },
    hr: { name: 'Croatia' },
    cz: { name: 'Czech Republic' }
  }
}

module.exports = db
