pipeline {
    agent any
    environment {
        POSTGRES_PASSWORD = credentials('POSTGRES_PASSWORD')
    }
    stages {
        stage('Clone Repository') {
            steps {
                git 'https://github.com/soyoonjeong2328/EzPay.git'
            }
        }

        stage('Prepare Environment') {
            steps {
                script {
                    sh '''
                    echo "POSTGRES_DB=postgres" > .env
                    echo "POSTGRES_USER=postgres" >> .env
                    echo "POSTGRES_PASSWORD=${POSTGRES_PASSWORD}" >> .env
                    echo "POSTGRES_URL=jdbc:postgresql://postgres:5432/postgres" >> .env
                    cat .env  # 생성된 .env 파일 확인
                    '''
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
