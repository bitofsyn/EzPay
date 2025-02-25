pipeline {
    agent any

    environment {
        DOCKER_HUB_USERNAME = credentials('docker_hub_username')  // Docker Hub ID
        DOCKER_HUB_PASSWORD = credentials('docker_hub_password')  // Docker Hub Access Token
        IMAGE_NAME = 'soyounjeong/ezpay' // Docker Hub에 업로드할 이미지 이름
    }

    stages {
        stage('Clone Repository') {
            steps {
                git branch: 'master', url: 'https://github.com/soyoonjeong2328/EzPay.git'
            }
        }

        stage('Build and Push Docker Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'DOCKER_HUB_CREDENTIALS', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                    docker build -t $IMAGE_NAME:latest .
                    docker login -u $DOCKER_USER -p $DOCKER_PASS
                    docker push $IMAGE_NAME:latest
                    '''
                }
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
                sh 'docker run -d -p 8080:8080 --name my_spring_app $IMAGE_NAME:latest'
            }
        }
    }
}
