const { environment } = require('@rails/webpacker')
// allows Webpack to understand .gql files
  environment.loaders.append("graphql", {
    test: /\.(graphql|gql)$/,
    exclude: /node_modules/,
    loader: "graphql-tag/loader"
  });
module.exports = environment
