pipeline {
    agent any

    environment {
        DOCKER_COMPOSE_FILE = "docker-compose.yml"
        ENV_FILE = ".env"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Stop Existing Containers') {
            steps {
                script {
                    sh 'docker-compose down'
                }
            }
        }

        stage('Build & Deploy') {
            steps {
                script {
                    sh 'docker-compose --env-file .env up -d --build'
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                script {
                    sh 'docker ps -a'
                    sh 'docker logs my_spring_app'
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
