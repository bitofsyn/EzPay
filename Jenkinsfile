pipeline {
    agent any

    environment {
        DOCKER_HUB_USERNAME = credentials('docker_hub_username')  // Jenkins에서 설정한 Docker Hub ID
        DOCKER_HUB_PASSWORD = credentials('docker_hub_password')  // Jenkins에서 설정한 Docker Hub 비밀번호 (Access Token)
    }

    stages {
        stage('Clone Repository') {
            steps {
                git branch: 'master', url: 'https://github.com/soyoonjeong2328/EzPay.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t ${DOCKER_HUB_USERNAME}/ezpay-app:latest .'
            }
        }

        stage('Login to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'DOCKER_HUB_USERNAME', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh 'docker login -u $DOCKER_USER -p $DOCKER_PASS'
                }
            }
        }


        stage('Push Docker Image to Docker Hub') {
            steps {
                bat 'docker push ${DOCKER_HUB_USERNAME}/ezpay-app:latest'
            }
        }

        stage('Stop and Remove Previous Container') {
            steps {
                bat '''
                docker stop my_spring_app || echo "Container not found"
                docker rm my_spring_app || echo "No such container"
                '''
            }
        }

        stage('Run Docker Container') {
            steps {
                bat 'docker run -d -p 8080:8080 --name my_spring_app ${DOCKER_HUB_USERNAME}/ezpay-app:latest'
            }
        }
    }
}