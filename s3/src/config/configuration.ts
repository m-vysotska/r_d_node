export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 's3_upload_dev',
  },
  aws: {
    region: process.env.AWS_REGION || 'eu-central-1',
    s3Bucket: process.env.S3_BUCKET || 'my-uploads-bucket',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  /** Optional. If set, view URLs use CloudFront; otherwise (dev) use direct S3 URL. */
  cloudFrontBaseUrl: process.env.CLOUDFRONT_BASE_URL || null,
});
