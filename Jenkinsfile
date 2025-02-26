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

        stage('Remove All Existing Docker Data') {
            steps {
                script {
                    // 모든 실행 중인 컨테이너 중지 및 삭제
                    sh '''
                    docker ps -q | xargs -r docker stop
                    docker ps -aq | xargs -r docker rm -f
                    docker images -q | xargs -r docker rmi -f
                    docker volume ls -q | xargs -r docker volume rm -f
                    docker network ls -q | xargs -r docker network rm
                    '''
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    sh 'docker-compose build'
                }
            }
        }

        stage('Deploy New Containers') {
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