pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "your-dockerhub-username/your-image-name:latest"
        DOCKER_COMPOSE_FILE = "docker-compose.yml"
        ENV_FILE = ".env"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh 'docker-compose build'
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    withDockerRegistry([credentialsId: 'docker-hub-credentials', url: '']) {
                        sh 'docker tag my_spring_app $DOCKER_IMAGE'
                        sh 'docker push $DOCKER_IMAGE'
                    }
                }
            }
        }

        stage('Deploy Containers') {
            steps {
                script {
                    sh 'docker-compose --env-file .env up -d'
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                script {
                    sh 'docker ps -a'
                    sh 'docker-compose logs app'
                }
            }
        }
    }

    post {
        failure {
            sh 'docker-compose logs'
        }
    }
}
