class RoleEntity {
  constructor({ id, role_name, is_active, created_at, created_by, updated_at, updated_by }) {
    this.id = id;
    this.role_name = role_name;
    this.is_active = is_active;
    this.created_at = created_at;
    this.created_by = created_by;
    this.updated_at = updated_at;
    this.updated_by = updated_by;
  }
}

module.exports = { RoleEntity };
