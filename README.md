# AIMove Motion Analysis app

Un visualiseur d'animation BVH (Biovision Hierarchy) avancé développé avec Vite, TypeScript, SolidJS et Three.js pour l'analyse de mouvement.

[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SolidJS](https://img.shields.io/badge/SolidJS-2C4F7C?style=for-the-badge&logo=solid&logoColor=white)](https://www.solidjs.com/)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)

## 🎯 Description

AIMove Motion Analysis est un outil avancé de visualisation et d'analyse de capture de mouvement au format BVH. Il inclut :

- **Visualisation 3D interactive** : Affichage en temps réel des squelettes animés avec Three.js
- **Contrôles de caméra avancés** : Navigation libre dans la scène 3D avec OrbitControls
- **Analyse de données intelligente** : Extraction et analyse des données de mouvement avec IA
- **Interface moderne** : Interface utilisateur développée avec SolidJS et Material-UI
- **Prédiction de mouvement** : Algorithmes de forecasting pour l'analyse prédictive

## 🚀 Installation

```bash
# Cloner le repository
git clone https://github.com/youssefhergal/-AIMove-Motion-Analysis-app.git
cd -AIMove-Motion-Analysis-app

# Installer les dépendances
npm install
```

## 📦 Dépendances principales

- **SolidJS** : Framework réactif pour l'interface utilisateur
- **Three.js** : Bibliothèque 3D pour la visualisation avancée
- **TensorFlow.js** : Analyse de données et machine learning
- **Plotly.js** : Visualisation de graphiques interactifs
- **Material-UI** : Composants d'interface utilisateur modernes

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
AIMove-Motion-Analysis-app/
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
- Rendu en temps réel avec optimisations

### Analyse de données
- Extraction des données de mouvement
- Analyse des angles articulaires
- Prédiction et forecasting avec IA
- Export des données au format CSV

### Interface utilisateur
- Interface moderne et responsive
- Contrôles de lecture d'animation
- Sélecteurs d'articulations
- Visualisation de graphiques interactifs

## 🔧 Configuration

Le projet utilise :
- **Vite** comme bundler ultra-rapide
- **TypeScript** pour le typage statique
- **SolidJS** pour l'interface utilisateur réactive
- **Three.js** pour le rendu 3D avancé

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

Pour toute question ou problème, veuillez ouvrir une issue sur le [repository GitHub](https://github.com/youssefhergal/-AIMove-Motion-Analysis-app).

## 🔗 Liens utiles

- [Documentation Three.js](https://threejs.org/docs/)
- [Documentation SolidJS](https://www.solidjs.com/guides)
- [Documentation Vite](https://vitejs.dev/guide/)
