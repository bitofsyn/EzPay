pipeline {
    agent any

    environment {
        DOCKER_HUB_USERNAME = 'soyounjeong'  // 직접 사용자명 입력
        DOCKER_HUB_REPO = 'ezpay'
    }

    stages {
        stage('Clone Repository') {
            steps {
                git branch: 'master', url: 'https://github.com/soyoonjeong2328/EzPay.git'
            }
        }

        stage('Login to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'DOCKER_HUB_USERNAME', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                }
            }
        }

        stage('Build and Push Docker Image') {
            steps {
                sh '''
                docker build -t $DOCKER_HUB_USERNAME/$DOCKER_HUB_REPO:latest .
                docker push $DOCKER_HUB_USERNAME/$DOCKER_HUB_REPO:latest
                '''
            }
        }

        stage('Stop and Remove Previous Container') {
            steps {
                sh '''
                docker stop my_spring_app || echo "Container not found"
                docker rm my_spring_app || echo "No such container"
                '''
            }
        }

        stage('Run Docker Container') {
            steps {
                sh '''
                docker run -d -p 8080:8080 --name my_spring_app $DOCKER_HUB_USERNAME/$DOCKER_HUB_REPO:latest
                '''
            }
        }
    }
}