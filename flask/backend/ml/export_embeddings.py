class UserEmbedding(db.Model):
    __tablename__ = "USER_EMBEDDINGS"
    user_id = db.Column("USER_ID", db.BigInteger, primary_key=True)
    vector = db.Column("VECTOR", db.Text, nullable=False)

    def to_array(self):
        return [float(x) for x in self.vector.split(",")]

class RecipeEmbedding(db.Model):
    __tablename__ = "RECIPE_EMBEDDINGS"
    rcp_sno = db.Column("RCP_SNO", db.BigInteger, primary_key=True)
    vector = db.Column("VECTOR", db.Text, nullable=False)

    def to_array(self):
        return [float(x) for x in self.vector.split(",")]