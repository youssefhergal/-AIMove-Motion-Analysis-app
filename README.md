# BVH Animation Viewer

Un visualiseur d'animation BVH (Biovision Hierarchy) développé avec Vite, TypeScript, SolidJS et Three.js.

## 🎯 Description

Ce projet permet de visualiser et analyser des animations de capture de mouvement au format BVH. Il inclut :

- **Visualisation 3D** : Affichage interactif des squelettes animés avec Three.js
- **Contrôles de caméra** : Navigation libre dans la scène 3D
- **Analyse de données** : Extraction et analyse des données de mouvement
- **Interface moderne** : Interface utilisateur développée avec SolidJS et Material-UI

## 🚀 Installation

```bash
# Cloner le repository
git clone <votre-repo-url>
cd vite_solis_ts_v5

# Installer les dépendances
npm install
```

## 📦 Dépendances principales

- **SolidJS** : Framework réactif pour l'interface utilisateur
- **Three.js** : Bibliothèque 3D pour la visualisation
- **TensorFlow.js** : Analyse de données et machine learning
- **Plotly.js** : Visualisation de graphiques
- **Material-UI** : Composants d'interface utilisateur

## 🎮 Utilisation

### Développement

```bash
npm run dev
```

L'application sera accessible à l'adresse [http://localhost:5173](http://localhost:5173)

### Build de production

```bash
npm run build
```

### Prévisualisation

```bash
npm run preview
```

## 📁 Structure du projet

```
vite_solis_ts_v5/
├── src/
│   ├── scripts/
│   │   ├── myScene.js          # Logique principale de la scène 3D
│   │   ├── kfgom/              # Module d'analyse KFGOM
│   │   └── ...                 # Composants React/SolidJS
│   ├── App.tsx                 # Composant principal
│   └── ...
├── bvh2/                       # Fichiers d'animation BVH
├── public/                     # Assets publics
├── build/                      # Bibliothèques Three.js
└── saved_model/                # Modèles TensorFlow sauvegardés
```

## 🎨 Fonctionnalités

### Visualisation 3D
- Affichage interactif des squelettes animés
- Contrôles de caméra (zoom, rotation, pan)
- Sélection interactive des articulations
- Rendu en temps réel

### Analyse de données
- Extraction des données de mouvement
- Analyse des angles articulaires
- Prédiction et forecasting
- Export des données

### Interface utilisateur
- Interface moderne et responsive
- Contrôles de lecture d'animation
- Sélecteurs d'articulations
- Visualisation de graphiques

## 🔧 Configuration

Le projet utilise :
- **Vite** comme bundler
- **TypeScript** pour le typage
- **SolidJS** pour l'interface utilisateur
- **Three.js** pour le rendu 3D

## 📝 Scripts disponibles

- `npm run dev` : Lance le serveur de développement
- `npm run build` : Compile pour la production
- `npm run preview` : Prévisualise le build de production

## 🤝 Contribution

1. Fork le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence privée.

## 📞 Support

Pour toute question ou problème, veuillez ouvrir une issue sur le repository.
