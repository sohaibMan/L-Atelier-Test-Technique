import mongoose, { Document, Schema } from "mongoose";

// Interface pour les données du pays
export interface ICountry {
  picture: string;
  code: string;
}

// Interface pour les données statistiques du joueur
export interface IPlayerData {
  rank: number;
  points: number;
  weight: number; // en grammes
  height: number; // en cm
  age: number;
  last: number[]; // Derniers résultats (1 = victoire, 0 = défaite)
}

// Interface pour le document Player
export interface IPlayer extends Document {
  id: number;
  firstname: string;
  lastname: string;
  shortname: string;
  sex: "M" | "F";
  country: ICountry;
  picture: string;
  data: IPlayerData;
  createdAt: Date;
  updatedAt: Date;
  toPublicJSON(): {
    id: number;
    firstname: string;
    lastname: string;
    shortname: string;
    sex: string;
    country: ICountry;
    picture: string;
    data: IPlayerData;
    createdAt: Date;
    updatedAt: Date;
  };
}

// Schéma pour les données du pays
const countrySchema = new Schema<ICountry>(
  {
    picture: {
      type: String,
      required: [true, "L'image du pays est requise"],
      match: [/^https?:\/\/.+/, "L'URL de l'image doit être valide"],
    },
    code: {
      type: String,
      required: [true, "Le code du pays est requis"],
      uppercase: true,
      minlength: [2, "Le code du pays doit contenir au moins 2 caractères"],
      maxlength: [3, "Le code du pays ne peut pas dépasser 3 caractères"],
    },
  },
  { _id: false }
);

// Schéma pour les données statistiques
const playerDataSchema = new Schema<IPlayerData>(
  {
    rank: {
      type: Number,
      required: [true, "Le classement est requis"],
      min: [1, "Le classement doit être supérieur à 0"],
    },
    points: {
      type: Number,
      required: [true, "Les points sont requis"],
      min: [0, "Les points ne peuvent pas être négatifs"],
    },
    weight: {
      type: Number,
      required: [true, "Le poids est requis"],
      min: [30000, "Le poids doit être d'au moins 30kg (30000g)"],
      max: [200000, "Le poids ne peut pas dépasser 200kg (200000g)"],
    },
    height: {
      type: Number,
      required: [true, "La taille est requise"],
      min: [140, "La taille doit être d'au moins 140cm"],
      max: [250, "La taille ne peut pas dépasser 250cm"],
    },
    age: {
      type: Number,
      required: [true, "L'âge est requis"],
      min: [16, "L'âge doit être d'au moins 16 ans"],
      max: [50, "L'âge ne peut pas dépasser 50 ans"],
    },
    last: {
      type: [Number],
      required: [true, "Les derniers résultats sont requis"],
      validate: {
        validator: function (arr: number[]) {
          return arr.length === 5 && arr.every((val) => val === 0 || val === 1);
        },
        message:
          "Les derniers résultats doivent contenir exactement 5 valeurs (0 ou 1)",
      },
    },
  },
  { _id: false }
);

// Schéma principal pour Player
const playerSchema = new Schema<IPlayer>(
  {
    id: {
      type: Number,
      required: [true, "L'ID du joueur est requis"],
      unique: true,
      min: [1, "L'ID doit être supérieur à 0"],
    },
    firstname: {
      type: String,
      required: [true, "Le prénom est requis"],
      trim: true,
      minlength: [2, "Le prénom doit contenir au moins 2 caractères"],
      maxlength: [50, "Le prénom ne peut pas dépasser 50 caractères"],
    },
    lastname: {
      type: String,
      required: [true, "Le nom de famille est requis"],
      trim: true,
      minlength: [2, "Le nom de famille doit contenir au moins 2 caractères"],
      maxlength: [50, "Le nom de famille ne peut pas dépasser 50 caractères"],
    },
    shortname: {
      type: String,
      required: [true, "Le nom court est requis"],
      trim: true,
      uppercase: true,
      match: [
        /^[A-Z]\.[A-Z]{2,4}$/,
        "Le format du nom court doit être X.XXX (ex: R.NAD)",
      ],
    },
    sex: {
      type: String,
      required: [true, "Le sexe est requis"],
      enum: {
        values: ["M", "F"],
        message: "Le sexe doit être 'M' (Masculin) ou 'F' (Féminin)",
      },
    },
    country: {
      type: countrySchema,
      required: [true, "Les informations du pays sont requises"],
    },
    picture: {
      type: String,
      required: [true, "L'image du joueur est requise"],
      match: [/^https?:\/\/.+/, "L'URL de l'image doit être valide"],
    },
    data: {
      type: playerDataSchema,
      required: [true, "Les données statistiques sont requises"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: function (doc, ret) {
        return {
          id: ret.id,
          firstname: ret.firstname,
          lastname: ret.lastname,
          shortname: ret.shortname,
          sex: ret.sex,
          country: ret.country,
          picture: ret.picture,
          data: ret.data,
          createdAt: ret.createdAt,
          updatedAt: ret.updatedAt,
        };
      },
    },
  }
);

// Index pour optimiser les performances
playerSchema.index({ id: 1 }, { unique: true });
playerSchema.index({ "data.rank": 1 });
playerSchema.index({ sex: 1 });
playerSchema.index({ "country.code": 1 });
playerSchema.index({ firstname: 1, lastname: 1 });

// Méthodes d'instance
playerSchema.methods.toPublicJSON = function () {
  return {
    id: this.id,
    firstname: this.firstname,
    lastname: this.lastname,
    shortname: this.shortname,
    sex: this.sex,
    country: this.country,
    picture: this.picture,
    data: this.data,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// Méthodes statiques (unused but kept for future use)
// playerSchema.statics.findByRank = function(rank: number) {
//   return this.findOne({ "data.rank": rank });
// };

// playerSchema.statics.findBySex = function(sex: "M" | "F") {
//   return this.find({ sex });
// };

// playerSchema.statics.findByCountry = function(countryCode: string) {
//   return this.find({ "country.code": countryCode.toUpperCase() });
// };

// playerSchema.statics.getTopPlayers = function(limit: number = 10) {
//   return this.find().sort({ "data.rank": 1 }).limit(limit);
// };

// Interface pour les méthodes statiques (unused but kept for future use)
// interface IPlayerModel extends mongoose.Model<IPlayer> {
//   findByRank(rank: number): Promise<IPlayer | null>;
//   findBySex(sex: "M" | "F"): Promise<IPlayer[]>;
//   findByCountry(countryCode: string): Promise<IPlayer[]>;
//   getTopPlayers(limit?: number): Promise<IPlayer[]>;
// }

// Middleware pre-save pour la validation
playerSchema.pre("save", function () {
  // Normaliser les données
  if (this.firstname) {
    this.firstname = this.firstname.trim();
  }
  if (this.lastname) {
    this.lastname = this.lastname.trim();
  }
  if (this.shortname) {
    this.shortname = this.shortname.toUpperCase().trim();
  }
  if (this.country?.code) {
    this.country.code = this.country.code.toUpperCase().trim();
  }
});

// Middleware post-save pour les logs
playerSchema.post("save", function () {
  // eslint-disable-next-line no-console
  console.log(
    `Joueur sauvegardé: ${this.firstname} ${this.lastname} (${this.shortname})`
  );
});

// Export du modèle
export const Player = mongoose.model<IPlayer>("Player", playerSchema);
export default Player;
