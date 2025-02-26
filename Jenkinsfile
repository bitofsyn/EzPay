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

        stage('Create .env File if Missing') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'POSTGRES_PASSWORD', variable: 'DB_PASSWORD')]) {
                        sh '''
                        if [ ! -f .env ]; then
                            echo "POSTGRES_DB=postgres" > .env
                            echo "POSTGRES_USER=postgres" >> .env
                            echo "POSTGRES_PASSWORD=$DB_PASSWORD" >> .env
                            echo "POSTGRES_URL=jdbc:postgresql://postgres:5432/postgres" >> .env
                        fi
                        cat .env  # 생성된 .env 파일 확인 (비밀번호 제외)
                        '''
                    }
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