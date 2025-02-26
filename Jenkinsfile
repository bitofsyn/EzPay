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

        stage('Clean Up Docker') {  // ✅ 기존 Docker 컨테이너, 이미지, 볼륨 삭제
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
                    echo "POSTGRES_URL=jdbc:postgresql://host.docker.internal:5432/postgres" >> .env
                    cat .env  # 생성된 .env 파일 확인
                    '''
                }
            }
        }

        stage('Build & Deploy') {  // ✅ Docker 빌드 및 실행
            steps {
                script {
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
