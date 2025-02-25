pipeline {
    agent any

    environment {
        DOCKER_HUB_USERNAME = credentials('docker_hub_username')
        DOCKER_HUB_PASSWORD = credentials('docker_hub_password')
        IMAGE_NAME = "soyounjeong/ezpay:latest"  // Docker Hub 이미지 이름
    }

    stages {
        stage('Clone Repository') {
            steps {
                git branch: 'master', url: 'https://github.com/soyoonjeong2328/EzPay.git'
            }
        }

        stage('Build and Push Docker Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'DOCKER_HUB_USERNAME', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh 'docker build -t $IMAGE_NAME .'
                    sh 'docker login -u $DOCKER_USER -p $DOCKER_PASS'
                    sh 'docker push $IMAGE_NAME'
                }
            }
        }

        stage('Deploy to Server') {
            steps {
                script {
                    try {
                        sh 'docker stop my_spring_app || true'
                        sh 'docker rm my_spring_app || true'
                    } catch (Exception e) {
                        echo "No running container found."
                    }
                }
                sh 'docker pull $IMAGE_NAME'
                sh 'docker run -d -p 8080:8080 --name my_spring_app $IMAGE_NAME'
            }
        }
    }

    triggers {
        GenericTrigger(
            genericVariables: [
                [key: 'docker_push', value: 'true']
            ],
            genericRequestVariables: [
                [key: 'docker_push', value: 'true']
            ],
            token: 'my-dockerhub-webhook-token',  // Jenkins Webhook Token
            causeString: 'Triggered by Docker Hub Webhook'
        )
    }
}
