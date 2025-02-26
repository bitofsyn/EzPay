pipeline {
    agent any
    environment {
        POSTGRES_PASSWORD = credentials('POSTGRES_PASSWORD')
        SPRING_DATASOURCE_URL = sh(script: "grep SPRING_DATASOURCE_URL .env | cut -d '=' -f2", returnStdout: true).trim()
        SPRING_DATASOURCE_USERNAME = sh(script: "grep SPRING_DATASOURCE_USERNAME .env | cut -d '=' -f2", returnStdout: true).trim()
        SPRING_DATASOURCE_PASSWORD = sh(script: "grep SPRING_DATASOURCE_PASSWORD .env | cut -d '=' -f2", returnStdout: true).trim()
    }
    stages {
        stage('Clone Repository') {
            steps {
                git 'https://github.com/soyoonjeong2328/EzPay.git'
            }
        }

        stage('Clean Up Docker') {  // ✅ 기존 Docker 컨테이너 및 이미지 삭제
            steps {
                script {
                    sh '''
                    echo "Stopping and removing all running containers..."
                    docker ps -q | xargs -r docker stop
                    docker ps -aq | xargs -r docker rm -f

                    echo "Removing all Docker images..."
                    docker images -q | xargs -r docker rmi -f

                    echo "Removing all Docker volumes..."
                    docker volume ls -q | xargs -r docker volume rm -f

                    echo "Removing all Docker networks..."
                    docker network ls -q | xargs -r docker network rm
                    '''
                }
            }
        }

        stage('Prepare Environment') {  // ✅ .env 파일 자동 생성
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

        stage('Build & Deploy') {  // ✅ Docker 새로 빌드
            steps {
                script {
                    sh 'chmod +x gradlew'
                    sh './gradlew clean build -x test'
                    sh 'docker-compose down'
                    sh 'docker-compose --env-file .env up -d --build'
                }
            }
        }

        stage('Verify Deployment') {  // ✅ 컨테이너 상태 확인
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
