// Database helper utilities for common CRUD operations
const { AppError } = require('./errorHandler');

/**
 * Find a resource by ID or throw 404 error
 * @param {Object} Model - Sequelize model
 * @param {number|string} id - Resource ID
 * @param {string} resourceName - Name for error message (e.g., 'User', 'Team')
 * @param {Object} options - Optional Sequelize query options
 * @returns {Promise<Object>} Found resource
 * @throws {AppError} If resource not found
 */
async function findByIdOrFail(Model, id, resourceName = 'Resource', options = {}) {
  const resource = await Model.findByPk(id, options);
  if (!resource) {
    throw new AppError(`${resourceName} not found`, 404);
  }
  return resource;
}

/**
 * Find a resource or throw 404 error
 * @param {Object} Model - Sequelize model
 * @param {Object} query - Sequelize where clause
 * @param {string} resourceName - Name for error message
 * @param {Object} options - Optional Sequelize query options
 * @returns {Promise<Object>} Found resource
 * @throws {AppError} If resource not found
 */
async function findOneOrFail(Model, query, resourceName = 'Resource', options = {}) {
  const resource = await Model.findOne({ where: query, ...options });
  if (!resource) {
    throw new AppError(`${resourceName} not found`, 404);
  }
  return resource;
}

/**
 * Generic delete resource handler
 * @param {Object} Model - Sequelize model
 * @param {number|string} id - Resource ID
 * @param {string} resourceName - Name for success message
 * @returns {Promise<Object>} Success message
 */
async function deleteResource(Model, id, resourceName = 'Resource') {
  const resource = await findByIdOrFail(Model, id, resourceName);
  await resource.destroy();
  return { message: `${resourceName} deleted successfully` };
}

/**
 * Generic update resource handler
 * @param {Object} Model - Sequelize model
 * @param {number|string} id - Resource ID
 * @param {Object} data - Update data
 * @param {string} resourceName - Name for error message
 * @param {Object} options - Optional Sequelize query options
 * @returns {Promise<Object>} Updated resource
 */
async function updateResource(Model, id, data, resourceName = 'Resource', options = {}) {
  const resource = await findByIdOrFail(Model, id, resourceName, options);
  await resource.update(data);
  return resource;
}

module.exports = {
  findByIdOrFail,
  findOneOrFail,
  deleteResource,
  updateResource,
};
