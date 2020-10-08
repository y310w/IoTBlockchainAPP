module.exports = {
  siteMetadata: {
    title: `IoT Blockchain APP`,
    description: `Aplicación distribuida basada en Blockchain para dar soporte a IoT`,
    author: `Thejokeri`,
  },
  plugins: [
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `IoTBlockchainAPP`,
        short_name: `IoTBlockchainAPP`,
        start_url: `/`,
        background_color: `#123863`,
        theme_color: `#a2466c`,
        display: `standalone`,
        icon: `src/images/icon.png`
      },
    },
    `gatsby-plugin-offline`,
    `gatsby-plugin-react-helmet`,
  ],
}
