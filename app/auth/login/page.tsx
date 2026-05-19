"use client";
import vijuLogo from "@/assets/images/viju-logo.png";
import Image from "next/image";

const Login = () => {
  return (
    <main className="grid grid-cols-2">
      <section className="bg-linear-to-b from-primary via-orange to-secondary h-screen flex justify-center items-center">
        <div className="flex flex-col justify-center items-center space-y-4">
          <Image
            src={vijuLogo}
            alt="Viju Logo"
            width={200}
            height={200}
            className="w-30 h-30 rounded-lg"
          />
          <h1 className="text-4xl font-bold text-white">Viju</h1>
          <h4 className="text-lg font-normal text-white ">
            STAFF PORTAL – VIJU DISTRIBUTION
          </h4>
        </div>
      </section>

      <section className="bg-milkwhite h-screen flex justify-center items-center">
        <div className="flex flex-col space-y-3 justify-center items-center">
          <div>
            <h1 className=" text-3xl font-bold text-left">Welcome Back</h1>
            <p className="text-sm font-light text-muted text-left">
              Sign in with your viju staff credentials
            </p>
          </div>
          <form></form>
        </div>
      </section>
    </main>
  );
};

export default Login;
