pipeline {
    agent any

    stages {
        stage('Clone Repository') {
            steps {
                git branch: 'master', url: 'https://github.com/soyoonjeong2328/EzPay.git'
            }
        }

        stage('Run Tests') {
            steps {
                bat './gradlew test --no-daemon'
            }
        }

        stage('Stop Existing Containers') {
            steps {
                bat 'docker-compose down'
            }
        }

        stage('Build and Deploy') {
            steps {
                bat 'docker-compose up --build -d'
            }
        }
    }
}