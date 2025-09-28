class UserEntity {
  constructor({ id, name, email, role_id, is_active, created_at, created_by, updated_at, updated_by }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role_id = role_id;
    this.is_active = is_active;
    this.created_at = created_at;
    this.created_by = created_by;
    this.updated_at = updated_at;
    this.updated_by = updated_by;
  }
}

module.exports = { UserEntity };
