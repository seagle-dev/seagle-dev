function getBaseUrl(req) {
  return `${req.protocol}://${req.get('host')}`;
}

function getBookUrls(req, bookId) {
  const baseUrl = getBaseUrl(req);
  return {
    cover: `${baseUrl}/api/admin/books/${bookId}/cover`,
    pdf: `${baseUrl}/api/admin/books/${bookId}/pdf`,
  };
}

function getModelUrls(req, modelId) {
  const baseUrl = getBaseUrl(req);
  return {
    file: `${baseUrl}/api/admin/models/${modelId}/file`,
    thumbnail: `${baseUrl}/api/admin/models/${modelId}/thumbnail`,
  };
}

module.exports = {
  getBaseUrl,
  getBookUrls,
  getModelUrls,
};
