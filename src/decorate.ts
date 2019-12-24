import { decorate, injectable } from 'inversify';
import Conf from 'conf';
import { Client } from 'discord.js';

/* 3rd party code that needs to be decorated for the container */

decorate(injectable(), Conf);
decorate(injectable(), Client);
