import React from "react"
import PropTypes from "prop-types"
import { Helmet } from "react-helmet"
import { useStaticQuery, graphql } from "gatsby"

const SEO = ({ title, description, author }) => {
  const { site } = useStaticQuery(query)

  const {
    defaultTitle,
    defaultDescription,
    defaultAuthor,
  } = site.siteMetadata

  const seo = {
    title: title || defaultTitle,
    description: description || defaultDescription,
    author: author || defaultAuthor
  }

  return (
    <Helmet title={seo.title}>
      <meta name="description" content={seo.description} />
      <meta name="image" content={seo.image} />

      {seo.title && <meta property="og:title" content={seo.title} />}

      {seo.description && (
        <meta property="og:description" content={seo.description} />
      )}

      {seo.author && <meta property="og:title" content={seo.author} />}
    </Helmet>
  )
}

export default SEO

SEO.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  author: PropTypes.string,
}

SEO.defaultProps = {
  title: null,
  description: null,
  author: null,
}

const query = graphql`
  query SEO {
    site {
      siteMetadata {
        defaultTitle: title
        defaultDescription: description
        defaultAuthor: author
      }
    }
  }
`