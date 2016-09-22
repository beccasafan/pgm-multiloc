# PGM-MultiLoc
A tool to visualize coverage of multiple instances of PokemonGo-Map

### Run It
- Live Version: https://beccasafan.github.io/pgm-multiloc/

### Install Locally
- Clone the repository locally
- Edit the default values in `src/scripts/config.ts` per your preferences
  - The API key in the project will not work locally, you will need to generate a new Google Maps Api key at https://console.developers.google.com/apis/credentials and enable the Google Maps JavaScript API and Google Places API Web Service APIs
- Run `npm install`
- Open `dist\index.html` in your browser.

### Developing
- Run `npm run watch`.
- Changes will be watched by gulp and rebuilt as you save changes.
