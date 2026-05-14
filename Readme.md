// run postgresql

brew services start postgresql@14
brew services restart postgresql@14
brew services stop postgresql@14

// how to run 

npx prisma migrate dev —name init

npx prisma db seed

Npm run dev