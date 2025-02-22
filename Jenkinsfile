pipeline {
    agent any

    environment {
        DOCKER_HUB_REPO = 'soyoonjeong2328/ezpay' // Docker Hub 리포지토리명
    }

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

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t %DOCKER_HUB_REPO%:latest .'
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'DOCKER_HUB_CREDENTIALS', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                    bat 'docker login -u %DOCKER_USERNAME% -p %DOCKER_PASSWORD%'
                    bat 'docker tag %DOCKER_HUB_REPO%:latest %DOCKER_HUB_REPO%:latest'
                    bat 'docker push %DOCKER_HUB_REPO%:latest'
                }
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                bat 'docker-compose down'
                bat 'docker-compose up --build -d'
            }
        }
    }
}