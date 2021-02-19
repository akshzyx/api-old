# Spotistats Plus API

> API for advanced Spotify stats (only for Spotistats Plus users)

## Spotistats

Check out Spotistats for Spotify on the [Apple App Store](https://apps.apple.com/us/app/spotistats-for-spotify/id1526912392?uo=4) and [Google Play Store](https://play.google.com/store/apps/details?id=dev.netlob.spotistats). More information about the app can be found at [https://spotistats.app](https://spotistats.app)

### Requirements

- Docker
- NodeJS
- Typescript (TSC)

### Getting it running

```bash
cd spotistats-api
# edit .env.example and rename it to .env
npm install
yarn compile
docker-compose up
npx prisma migrate dev --preview-feature # generates types and pushes schema to db.
node dist/
```

## License

[GNU General Public License v3.0](./LICENSE)
